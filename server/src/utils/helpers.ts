import jwt from 'jsonwebtoken';
import { config } from '../config/app';
import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res: Response, message = 'Internal Server Error', statusCode = 500, details?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  static validationError(res: Response, errors: any) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res: Response, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

export class TokenHelper {
  static generateTokens(userId: number) {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): { userId: number; type: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      return { userId: decoded.userId, type: decoded.type };
    } catch (error) {
      return null;
    }
  }

  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export class DateHelper {
  static formatDate(date: Date | string, locale = 'pl-PL'): string {
    const d = new Date(date);
    return d.toLocaleDateString(locale);
  }

  static formatDateTime(date: Date | string, locale = 'pl-PL'): string {
    const d = new Date(date);
    return d.toLocaleString(locale);
  }

  static isToday(date: Date | string): boolean {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  static isThisWeek(date: Date | string): boolean {
    const d = new Date(date);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return d >= weekStart && d <= weekEnd;
  }

  static getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
    const d = new Date(date);
    const start = new Date(d.setDate(d.getDate() - d.getDay()));
    const end = new Date(d.setDate(d.getDate() - d.getDay() + 6));
    return { start, end };
  }

  static getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }
}

export class StringHelper {
  static truncate(text: string, length: number, suffix = '...'): string {
    if (!text || text.length <= length) {
      return text;
    }
    return text.substring(0, length - suffix.length) + suffix;
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static capitalizeFirst(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  static capitalizeWords(text: string): string {
    if (!text) return text;
    return text.split(' ').map(word => this.capitalizeFirst(word)).join(' ');
  }

  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static isValidPolishPhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+48)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
}

export class NumberHelper {
  static formatCurrency(amount: number, currency = 'PLN', locale = 'pl-PL'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  static roundToDecimal(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }
}

export class ArrayHelper {
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((groups: any, item) => {
      const group = (item[key] as any).toString();
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  }

  static sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return array.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export class AsyncHelper {
  static async retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retry(fn, retries - 1, delay * 2);
    }
  }

  static async timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), ms);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ErrorHelper {
  static isOperationalError(error: any): boolean {
    return error.isOperational === true;
  }

  static createError(message: string, statusCode: number = 500, isOperational: boolean = true): Error {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    error.isOperational = isOperational;
    return error;
  }

  static logError(error: any, context?: string) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    
    console.error(`${timestamp}${contextStr} ERROR:`, {
      message: error.message,
      stack: error.stack,
      ...(error.statusCode && { statusCode: error.statusCode }),
      ...(error.isOperational !== undefined && { isOperational: error.isOperational })
    });
  }
}

export default {
  ApiResponse,
  TokenHelper,
  DateHelper,
  StringHelper,
  NumberHelper,
  ArrayHelper,
  AsyncHelper,
  ErrorHelper
};