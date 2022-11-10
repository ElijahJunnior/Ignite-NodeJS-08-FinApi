import { inject, injectable } from "tsyringe";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { Statement } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateTransferStatementDTO } from "./CreateTransferStatementDTO";
import { CreateTransferStatementError } from "./CreateTransferStatementError";

@injectable()
class CreateTransferStatementUseCase {
  constructor(
    @inject("StatementsRepository")
    private statementsRepository: IStatementsRepository,
    @inject("UsersRepository")
    private usersRepository: IUsersRepository
  ) {}

  async execute({
    amount, description, type, user_id, sender_id
  }: CreateTransferStatementDTO): Promise<Statement> {
    const sender_user = await this.usersRepository.findById(user_id);

    if (!sender_user) {
      throw new CreateTransferStatementError.UserNotFound();
    }

    const { balance } = await this.statementsRepository.getUserBalance({
      user_id: sender_id as string,
      with_statement: false
    });

    if (balance < amount ) {
      throw new CreateTransferStatementError.InsufficientFounds();
    }

    const recipient_user = await this.usersRepository.findById(user_id);

    if (!recipient_user) {
      throw new CreateTransferStatementError.RecipientUserNotFound();
    }

    return this.statementsRepository.create({
      amount,
      description,
      type,
      user_id,
      sender_id
    });
  }
}

export { CreateTransferStatementUseCase };
