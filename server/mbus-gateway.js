/**
 * M-Bus Gateway TCP Server Module
 * Orion GSM, Wimbus, Integral gateway'leri için TCP sunucu
 *
 * Gateway'ler bu sunucuya bağlanır ve komut bekler
 * Okuma komutları gönderilir, yanıtlar parse edilir
 */

import net from 'net';
import { EventEmitter } from 'events';

class MBusGatewayManager extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // IMEI -> socket
    this.pendingCommands = new Map(); // IMEI -> {resolve, reject, timeout}
    this.gatewayStatus = new Map(); // IMEI -> {connected, lastSeen, ip, port}
    this.server = null;
    this.port = 5000; // M-Bus gateway port
  }

  // TCP Sunucuyu başlat
  startServer(port = 5000) {
    this.port = port;

    this.server = net.createServer((socket) => {
      console.log(`[M-Bus] Yeni bağlantı: ${socket.remoteAddress}:${socket.remotePort}`);

      let imei = null;
      let buffer = Buffer.alloc(0);

      socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);

        // Gateway tanımlama paketi (ilk 20 byte genellikle IMEI içerir)
        if (!imei && buffer.length >= 15) {
          imei = this.parseIMEI(buffer);
          if (imei) {
            this.registerConnection(imei, socket);
            console.log(`[M-Bus] Gateway kayıtlı: ${imei}`);
          }
        }

        // Yanıt parse et
        const response = this.parseResponse(buffer);
        if (response) {
          buffer = Buffer.alloc(0);
          this.handleResponse(imei, response);
        }
      });

      socket.on('close', () => {
        if (imei) {
          this.unregisterConnection(imei);
          console.log(`[M-Bus] Gateway bağlantısı kesildi: ${imei}`);
        }
      });

      socket.on('error', (err) => {
        console.error(`[M-Bus] Socket hatası: ${err.message}`);
      });

      // 5 dakika timeout
      socket.setTimeout(300000);
      socket.on('timeout', () => {
        console.log(`[M-Bus] Timeout: ${socket.remoteAddress}`);
        socket.destroy();
      });
    });

    this.server.listen(port, () => {
      console.log(`[M-Bus] TCP Sunucu başlatıldı: port ${port}`);
    });

    this.server.on('error', (err) => {
      console.error(`[M-Bus] Sunucu hatası: ${err.message}`);
    });

    return this;
  }

  // Gateway bağlantısını kaydet
  registerConnection(imei, socket) {
    this.connections.set(imei, socket);
    this.gatewayStatus.set(imei, {
      connected: true,
      lastSeen: new Date(),
      ip: socket.remoteAddress,
      port: socket.remotePort
    });
    this.emit('gateway-connected', { imei, ip: socket.remoteAddress });
  }

  // Gateway bağlantısını kaldır
  unregisterConnection(imei) {
    this.connections.delete(imei);
    const status = this.gatewayStatus.get(imei);
    if (status) {
      status.connected = false;
      status.lastDisconnect = new Date();
    }
    this.emit('gateway-disconnected', { imei });
  }

  // IMEI parse et
  parseIMEI(buffer) {
    // Farklı gateway formatları için
    // Orion: IMEI direkt ASCII
    // Wimbus: Hexadecimal format

    const str = buffer.toString('ascii', 0, Math.min(buffer.length, 30));

    // 15 haneli IMEI pattern
    const imeiMatch = str.match(/\d{15}/);
    if (imeiMatch) return imeiMatch[0];

    // oriongsm-XXX pattern
    const orionMatch = str.match(/oriongsm-\d+/);
    if (orionMatch) return orionMatch[0];

    // integral-XXX pattern
    const integralMatch = str.match(/integral-\d+/);
    if (integralMatch) return integralMatch[0];

    // Wimbus hex pattern
    const wimbusMatch = str.match(/[0-9A-Fa-f]{20}/);
    if (wimbusMatch) return wimbusMatch[0];

    return null;
  }

  // M-Bus yanıtını parse et
  parseResponse(buffer) {
    if (buffer.length < 4) return null;

    // M-Bus standart frame kontrolü
    // Start byte: 0x68 (variable length frame) veya 0x10 (short frame)
    const startByte = buffer[0];

    if (startByte === 0x68) {
      // Variable length frame
      if (buffer.length < 4) return null;
      const length = buffer[1];
      if (buffer.length < length + 6) return null;

      return {
        type: 'variable',
        length: length,
        control: buffer[4],
        address: buffer[5],
        data: buffer.slice(6, 6 + length - 2),
        checksum: buffer[buffer.length - 2],
        raw: buffer
      };
    }

    if (startByte === 0x10) {
      // Short frame
      if (buffer.length < 5) return null;
      return {
        type: 'short',
        control: buffer[1],
        address: buffer[2],
        checksum: buffer[3],
        raw: buffer.slice(0, 5)
      };
    }

    if (startByte === 0xE5) {
      // Single character ACK
      return { type: 'ack' };
    }

    return null;
  }

  // Yanıtı işle
  handleResponse(imei, response) {
    const pending = this.pendingCommands.get(imei);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingCommands.delete(imei);
      pending.resolve(response);
    }

    this.emit('data-received', { imei, response });
  }

  // Gateway'e komut gönder
  async sendCommand(imei, command, timeout = 10000) {
    const socket = this.connections.get(imei);
    if (!socket) {
      throw new Error(`Gateway bağlı değil: ${imei}`);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingCommands.delete(imei);
        reject(new Error('Komut timeout'));
      }, timeout);

      this.pendingCommands.set(imei, { resolve, reject, timeout: timeoutId });
      socket.write(command);
    });
  }

  // M-Bus sayaç okuma komutu
  buildReadCommand(address) {
    // REQ_UD2 (Request User Data 2) - Standart M-Bus okuma komutu
    const buffer = Buffer.alloc(5);
    buffer[0] = 0x10; // Start byte (short frame)
    buffer[1] = 0x7B; // C field: REQ_UD2
    buffer[2] = address; // A field: primary address
    buffer[3] = (0x7B + address) & 0xFF; // Checksum
    buffer[4] = 0x16; // Stop byte
    return buffer;
  }

  // Sayaç verilerini parse et
  parseReadingData(response) {
    if (!response || !response.data) return null;

    const data = response.data;
    const result = {
      address: response.address,
      values: []
    };

    let offset = 0;

    // DIF (Data Information Field) ve VIF (Value Information Field) parse
    while (offset < data.length - 3) {
      const dif = data[offset];
      const vif = data[offset + 1];

      // Veri tipi ve boyutu belirle
      const dataLength = (dif & 0x07);
      const valueStart = offset + 2;

      if (valueStart + dataLength > data.length) break;

      // Değeri oku
      let value = 0;
      for (let i = 0; i < dataLength; i++) {
        value += data[valueStart + i] << (i * 8);
      }

      // VIF'e göre birim belirle
      const unit = this.getUnit(vif);

      result.values.push({
        dif: dif,
        vif: vif,
        value: value,
        unit: unit
      });

      offset += 2 + dataLength;
    }

    return result;
  }

  // VIF'e göre birim
  getUnit(vif) {
    // EN 13757-3 standart VIF kodları
    const units = {
      0x00: 'Wh', 0x01: 'Wh', 0x02: 'Wh', 0x03: 'kWh',
      0x04: 'kWh', 0x05: 'kWh', 0x06: 'MWh', 0x07: 'MWh',
      0x10: 'm³', 0x11: 'm³', 0x12: 'm³', 0x13: 'L',
      0x14: 'L', 0x15: 'L', 0x16: 'L', 0x17: 'L',
      0x58: '°C', 0x59: '°C', 0x5A: '°C', 0x5B: '°C',
      0x5C: '°C', 0x5D: '°C', 0x5E: '°C', 0x5F: '°C'
    };
    return units[vif & 0x7F] || 'unknown';
  }

  // Sayaç oku
  async readMeter(imei, primaryAddress) {
    try {
      const command = this.buildReadCommand(primaryAddress);
      const response = await this.sendCommand(imei, command, 15000);

      if (response.type === 'ack') {
        // ACK aldık, veri bekliyoruz
        // Bazı gateway'ler ACK sonrası veriyi ayrı gönderiyor
        return new Promise((resolve) => {
          const onData = ({ imei: rImei, response: dataResponse }) => {
            if (rImei === imei && dataResponse.type === 'variable') {
              this.removeListener('data-received', onData);
              resolve(this.parseReadingData(dataResponse));
            }
          };
          this.on('data-received', onData);

          // 10 saniye bekle
          setTimeout(() => {
            this.removeListener('data-received', onData);
            resolve(null);
          }, 10000);
        });
      }

      return this.parseReadingData(response);
    } catch (err) {
      console.error(`[M-Bus] Okuma hatası (${imei}/${primaryAddress}): ${err.message}`);
      return null;
    }
  }

  // Bağlı gateway'leri listele
  getConnectedGateways() {
    return Array.from(this.gatewayStatus.entries())
      .filter(([_, status]) => status.connected)
      .map(([imei, status]) => ({
        imei,
        ...status
      }));
  }

  // Gateway durumunu getir
  getGatewayStatus(imei) {
    return this.gatewayStatus.get(imei) || { connected: false };
  }

  // Sunucuyu durdur
  stop() {
    if (this.server) {
      this.server.close();
      this.connections.forEach(socket => socket.destroy());
      this.connections.clear();
    }
  }
}

// Singleton instance
const gatewayManager = new MBusGatewayManager();

export default gatewayManager;
export { MBusGatewayManager };
