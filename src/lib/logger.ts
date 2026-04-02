import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class Logger {
  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  static error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  static dim(message: string): void {
    console.log(chalk.dim(message));
  }

  static bold(message: string): void {
    console.log(chalk.bold(message));
  }

  static spinner(text: string): Ora {
    return ora(text).start();
  }

  static table(data: Array<Record<string, any>>, headers?: string[]): void {
    if (data.length === 0) {
      Logger.dim('No data to display');
      return;
    }

    const keys = headers || Object.keys(data[0]);
    const maxWidths = keys.map(key => 
      Math.max(key.length, ...data.map(row => String(row[key] || '').length))
    );

    // Header
    const headerRow = keys.map((key, i) => 
      chalk.bold(key.padEnd(maxWidths[i]))
    ).join(' | ');
    console.log(headerRow);
    console.log(keys.map((_, i) => '-'.repeat(maxWidths[i])).join('-|-'));

    // Data rows
    data.forEach(row => {
      const dataRow = keys.map((key, i) => 
        String(row[key] || '').padEnd(maxWidths[i])
      ).join(' | ');
      console.log(dataRow);
    });
  }

  static json(data: any): void {
    console.log(JSON.stringify(data, null, 2));
  }
}