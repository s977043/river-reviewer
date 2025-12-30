import ora from 'ora';

export class Logger {
  constructor(options = {}) {
    this.silent = options.silent ?? false;
    this.spinner = null;
  }

  info(message) {
    if (!this.silent) {
      console.log(message);
    }
  }

  error(message) {
    if (!this.silent) {
      console.error(message);
    }
  }

  success(message) {
    if (!this.silent) {
      console.log(`✓ ${message}`);
    }
  }

  warn(message) {
    if (!this.silent) {
      console.warn(`⚠ ${message}`);
    }
  }

  startSpinner(message) {
    if (!this.silent) {
      this.spinner = ora(message).start();
    }
  }

  succeedSpinner(message) {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  failSpinner(message) {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  stopSpinner() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}
