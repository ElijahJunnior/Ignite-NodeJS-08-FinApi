import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateTransferStatementError } from "./CreateTransferStatementError";
import { CreateTransferStatementUseCase } from "./CreateTransferStatementUseCase"

let statementsRepository: InMemoryStatementsRepository;
let usersRepository: InMemoryUsersRepository;
let createTransferStatementUseCase: CreateTransferStatementUseCase;

describe("Create Transfer Statement Use Case", () => {
  beforeEach(async () => {
    statementsRepository = new InMemoryStatementsRepository();
    usersRepository = new InMemoryUsersRepository();
    createTransferStatementUseCase = new CreateTransferStatementUseCase(
      statementsRepository,
      usersRepository
    );
  })

  it("Should be able to create a transfer statement", async () => {
    const senderUser = await usersRepository.create({
      name: "Sender User",
      email: "sender.user@fin_api.com.br",
      password: "password123"
    });

    expect(senderUser).toHaveProperty("id");

    const recipientUser = await usersRepository.create({
      name: "Recipient User",
      email: "recipient.user@fin_api.com.br",
      password: "password123"
    });

    expect(recipientUser).toHaveProperty("id");

    const initialStatement = await statementsRepository.create({
      amount: 200,
      description: "Initial balance",
      type: OperationType.DEPOSIT,
      user_id: senderUser.id as string
    })

    expect(initialStatement).toHaveProperty("id");

    const transferStatement = await createTransferStatementUseCase.execute({
      amount: 150,
      description: "Transfer test",
      type: OperationType.TRANSFER,
      user_id: recipientUser.id as string,
      sender_id: senderUser.id as string
    })

    expect(transferStatement).toHaveProperty("id");
  })

  it("Shouldn't be able to create a transfer statement to non existent Recipient User", async () => {
    const senderUser = await usersRepository.create({
      name: "Sender User",
      email: "sender.user@fin_api.com.br",
      password: "password123"
    });

    expect(senderUser).toHaveProperty("id");

    const initialStatement = await statementsRepository.create({
      amount: 200,
      description: "Initial balance",
      type: OperationType.DEPOSIT,
      user_id: senderUser.id as string
    })

    expect(initialStatement).toHaveProperty("id");

    await expect(
      createTransferStatementUseCase.execute({
        amount: 150,
        description: "Transfer test",
        type: OperationType.TRANSFER,
        user_id: "1ea76aba-b6ca-57b6-a5ad-50f48319cfb6",
        sender_id: senderUser.id as string
      })
    ).rejects.toEqual(
      new CreateTransferStatementError.RecipientUserNotFound()
    );
  })

  it("Shouldn't be able to create a transfer statement without sufficient funds", async () => {
    const senderUser = await usersRepository.create({
      name: "Sender User",
      email: "sender.user@fin_api.com.br",
      password: "password123"
    });

    expect(senderUser).toHaveProperty("id");

    const recipientUser = await usersRepository.create({
      name: "Recipient User",
      email: "recipient.user@fin_api.com.br",
      password: "password123"
    });

    expect(recipientUser).toHaveProperty("id");

    const initialStatement = await statementsRepository.create({
      amount: 100,
      description: "Initial balance",
      type: OperationType.DEPOSIT,
      user_id: senderUser.id as string
    })

    expect(initialStatement).toHaveProperty("id");

    await expect(
      createTransferStatementUseCase.execute({
        amount: 150,
        description: "Transfer test",
        type: OperationType.TRANSFER,
        user_id: recipientUser.id as string,
        sender_id: senderUser.id as string
      })
    ).rejects.toEqual(
      new CreateTransferStatementError.InsufficientFounds()
    );
  })
})
