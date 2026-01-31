import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * 东方财富 HTTP 请求服务
 * 封装了与东方财富 API 交互的通用逻辑
 */
@Injectable()
export class EastMoneyHttpService {
  private readonly headers = {
    validmark:
      'aKVEnBbJF9Nip2Wjf4de/fSvA8W3X3iB4L6vT0Y5cxvZbEfEm17udZKUD2qy37dLRY3bzzHLDv+up/Yn3OTo5Q==',
  };

  private readonly deviceId = '874C427C-7C24-4980-A835-66FD40B67605';
  private readonly version = '6.5.5';

  private readonly baseData = {
    product: 'EFund',
    deviceid: this.deviceId,
    MobileKey: this.deviceId,
    plat: 'Iphone',
    PhoneType: 'IOS15.1.0',
    OSVersion: '15.5',
    version: this.version,
    ServerVersion: this.version,
    Version: this.version,
    appVersion: this.version,
  };

  /**
   * 发送 GET 请求
   */
  async get<T = any>(
    url: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    const res = await axios.get(url, {
      headers: this.headers,
      params: {
        ...this.baseData,
        ...params,
      },
    });
    return res.data;
  }

  /**
   * 发送 POST 请求
   */
  async post<T = any>(
    url: string,
    data: Record<string, any> = {},
  ): Promise<T> {
    const res = await axios.post(
      url,
      new URLSearchParams({
        ...this.baseData,
        ...data,
      }),
      {
        headers: this.headers,
      },
    );
    return res.data;
  }

  /**
   * 发送 JSONP 请求
   */
  async jsonp<T = any>(
    url: string,
    callback: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    const res = await axios.get(url, { params });
    const js = res.data.replace(/[\n]/g, '').replace(/\r/g, '');
    return JSON.parse(js.slice(callback.length + 1, js.length - 1));
  }

  /**
   * 发送 SSE 流式请求
   */
  async sse(
    url: string,
    params: Record<string, any> = {},
  ): Promise<NodeJS.ReadableStream> {
    const res = await axios.get(url, {
      headers: this.headers,
      params: {
        ...this.baseData,
        ...params,
      },
      responseType: 'stream',
    });
    return res.data;
  }
}
