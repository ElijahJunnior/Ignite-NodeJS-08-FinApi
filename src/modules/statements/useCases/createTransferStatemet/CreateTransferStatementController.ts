import { Request, Response } from "express";
import { container } from "tsyringe";
import { OperationType } from "../../entities/Statement";
import { CreateTransferStatementUseCase } from "./CreateTransferStatementUseCase";

class CreateTransferStatementController {
  async execute(req: Request, res: Response): Promise<Response> {
    const { id: sender_id } = req.user;
    const { user_id } = req.params;
    const { description, amount } = req.body;

    const createTransferStatementUseCase = container.resolve(CreateTransferStatementUseCase);

    const statement = await createTransferStatementUseCase.execute({
      amount,
      description,
      type: OperationType.TRANSFER,
      user_id,
      sender_id
    });

    return res.status(201).json(statement);
  }
}

export { CreateTransferStatementController };
