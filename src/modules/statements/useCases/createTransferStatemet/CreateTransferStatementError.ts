import { AppError } from "../../../../shared/errors/AppError";

export namespace CreateTransferStatementError {
  export class UserNotFound extends AppError {
    constructor () {
      super("User not found", 404);
    }
  }

  export class RecipientUserNotFound extends AppError {
    constructor () {
      super("Recipient User not found", 404);
    }
  }

  export class InsufficientFounds extends AppError {
    constructor () {
      super("InsufficientFounds", 400);
    }
  }
}
