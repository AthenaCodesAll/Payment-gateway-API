import { StatusCodes } from 'http-status-codes';
import fetch, { BodyInit, RequestInit } from 'node-fetch';
import { BadRequestError } from '../utils/ApiError';

class BaseApi {
  baseUrl: string;

  // Set base URL
  constructor(url: string) {
    this.baseUrl = url;
  }

   // Main fetch function
  fetch = async (
    url: string,
    body?: BodyInit,
    args?: Record<string, string>,
    requestInit?: RequestInit
  ) => {
    try {
      const urlObj = new URL(url, this.baseUrl);

       // Add query params if any
      if (args) {
        urlObj.search = new URLSearchParams(args).toString();
      }

      const requestOptions = { ...requestInit, body };

      const response = await fetch(urlObj.toString(), requestOptions);

       // Throw error if response is not ok
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new BadRequestError(errorMessage);
      }

       // Return nothing if no content
      if (response.status === StatusCodes.NO_CONTENT) {
        return;
      }

      // Return response as JSON
      return response.json();
    } catch (e: any) {
      throw new BadRequestError(e.message);
    }
  };

  // GET request
  get = <T>(
    url: string,
    args?: Record<string, any>,
    requestInit?: RequestInit
  ): Promise<T> =>
    this.fetch(url, undefined, args, { ...requestInit, method: 'GET' });

  // POST request
    post = <T>(
    url: string,
    body?: Record<string, any>,
    args?: Record<string, any>,
    requestInit?: RequestInit
  ): Promise<T> => {
    const bodyString = body ? JSON.stringify(body) : undefined;

    return this.fetch(url, bodyString, args, {
      ...requestInit,
      method: 'POST',
    });
  };
}

//Export class
export default BaseApi;
