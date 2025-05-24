import { StatusCodes } from 'http-status-codes';
import fetch, { BodyInit, RequestInit } from 'node-fetch';
import { BadRequestError } from '../utils/ApiError.js';

class BaseApi {
  baseUrl: string;

  constructor(url: string) {
    this.baseUrl = url;
  }

  fetch = async (
    url: string,
    body?: BodyInit,
    args?: Record<string, string>,
    requestInit?: RequestInit
  ) => {
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
        return;
      }

      return response.json();
    } catch (e: unknown) {
      throw new BadRequestError((e as Error).message || 'An unknown error occurred');
    }
  };

  get = <T>(
    url: string,
    args?: Record<string, string | number | boolean>,
    requestInit?: RequestInit
  ): Promise<T> =>
    this.fetch(url, undefined, args as Record<string, string>, { ...requestInit, method: 'GET' });

  post = <T>(
    url: string,
    body?: Record<string, unknown>,
    args?: Record<string, string | number | boolean>,
    requestInit?: RequestInit
  ): Promise<T> => {
    const bodyString = body ? JSON.stringify(body) : undefined;

    return this.fetch(url, bodyString, args as Record<string, string>, {
      ...requestInit,
      method: 'POST',
    });
  };
}

export default BaseApi;