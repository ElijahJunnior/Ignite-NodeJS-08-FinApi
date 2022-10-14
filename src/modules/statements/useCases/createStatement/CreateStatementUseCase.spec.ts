import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let usersRepository: IUsersRepository;
let statementsRepository: IStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;

describe("Create Statement Use Case", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementsRepository
    );
  })

  it("Should be able to create a statement", async () => {
    const user = await usersRepository.create({
      email: "user.test@fin-api.com",
      name: "User Test",
      password: "password123"
    });

    const statement = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 100,
      description: "Test Statement",
      type: OperationType.DEPOSIT
    });

    expect(statement).toHaveProperty('id');
  })

  it("Shouldn't be able to create a statement for user that doesn't exist", async () => {
    let error;

    try {
      await createStatementUseCase.execute({
        user_id: "non-existent_user",
        amount: 100,
        description: "Test Statement",
        type: OperationType.DEPOSIT
      });
    } catch(err) {
      error = err;
    }

    expect(error).toEqual(new CreateStatementError.UserNotFound);
  })

  it(
    "Shouldn't be able to create a withdrawal statement with a value greater than balance",
    async () => {
      let error;

      try {
        const user = await usersRepository.create({
          email: "user.test@fin-api.com",
          name: "User Test",
          password: "password123"
        });

        await createStatementUseCase.execute({
          user_id: user.id as string,
          amount: 100,
          description: "Test Deposit Statement",
          type: OperationType.DEPOSIT
        });

        await createStatementUseCase.execute({
          user_id: user.id as string,
          amount: 150,
          description: "Test Withdraw Statement",
          type: OperationType.WITHDRAW
        });
      } catch(err) {
        error = err;
      }

      expect(error).toEqual(new CreateStatementError.InsufficientFunds);
    }
  )
})
