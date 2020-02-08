export class AppError extends Error {
  __proto__: Error;
  publicMessage: string | undefined;

  constructor(message: string, publicMessage?: string) {
    const trueProto = new.target.prototype;
    super(message);
    this.name = this.constructor.name;
    this.stack = (new Error(message)).stack;

    this.publicMessage = publicMessage;

    this.__proto__ = trueProto;
  }
}
