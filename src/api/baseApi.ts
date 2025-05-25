import { StatusCodes } from 'http-status-codes';
import fetch, { BodyInit, RequestInit } from 'node-fetch';
import { BadRequestError } from '../utils/ApiError';

class BaseApi {
  baseUrl: string;

  constructor(url: string) {
    this.baseUrl = url;
  }

  fetch<T>(
    url: string,
    body?: BodyInit,
    args?: Record<string, string>,
    requestInit?: RequestInit
  ): Promise<T> {
    return (async () => {
      try {
        const urlObj = new URL(url, this.baseUrl);

        if (args) {
          urlObj.search = new URLSearchParams(args).toString();
        }

        const requestOptions = { ...requestInit, body };

        const response = await fetch(urlObj.toString(), requestOptions);

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new BadRequestError(errorMessage);
        }

        if (response.status === StatusCodes.NO_CONTENT) {
          return undefined as unknown as T; // safely cast `undefined` to T
        }

        return (await response.json()) as T;
      } catch (e: unknown) {
        throw new BadRequestError((e as Error).message || 'An unknown error occurred');
      }
    })();
  }

  get<T>(
    url: string,
    args?: Record<string, string | number | boolean>,
    requestInit?: RequestInit
  ): Promise<T> {
    const stringArgs = args
      ? Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)]))
      : undefined;

    return this.fetch<T>(url, undefined, stringArgs, {
      ...requestInit,
      method: 'GET',
    });
  }

  post<T>(
    url: string,
    body?: Record<string, unknown>,
    args?: Record<string, string | number | boolean>,
    requestInit?: RequestInit
  ): Promise<T> {
    const bodyString = body ? JSON.stringify(body) : undefined;
    const stringArgs = args
      ? Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)]))
      : undefined;

    return this.fetch<T>(url, bodyString, stringArgs, {
      ...requestInit,
      method: 'POST',
    });
  }
}

module.exports = BaseApi;
