import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let usersRepository: IUsersRepository;
let statementsRepository: IStatementsRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase;

describe("Get Statement Operation Use Case", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(usersRepository, statementsRepository);
  })

  it("Should be able to get a Operation Statement", async () => {
    const { id } = await usersRepository.create({
      email: "user.test@fin-api.com",
      name: "User Test",
      password: "password123"
    }) as { id: string };

    const expectedStatement = await statementsRepository.create({
      user_id: id as string,
      amount: 100,
      description: "Test Statement",
      type: OperationType.DEPOSIT
    });

    const receivedStatement = await getStatementOperationUseCase.execute({
      statement_id: expectedStatement.id as string,
      user_id: id
    });

    expect(receivedStatement).toEqual(expectedStatement);
  })

  it("Shouldn't be able to get a non-existent user's statement ", async () => {
    let error;

    try {
      const { id } = await usersRepository.create({
        email: "user.test@fin-api.com",
        name: "User Test",
        password: "password123"
      }) as { id: string };

      const expectedStatement = await statementsRepository.create({
        user_id: id as string,
        amount: 100,
        description: "Test Statement",
        type: OperationType.DEPOSIT
      });

      await getStatementOperationUseCase.execute({
        statement_id: expectedStatement.id as string,
        user_id: "non-existent_user_id"
      });
    } catch(err) {
      error = err;
    }

    expect(error).toEqual(new GetStatementOperationError.UserNotFound());
  })

  it("Shouldn't be able to get a non-existent Operation Statement ", async () => {
    let error;

    try {
      const { id } = await usersRepository.create({
        email: "user.test@fin-api.com",
        name: "User Test",
        password: "password123"
      }) as { id: string };

      await getStatementOperationUseCase.execute({
        statement_id: "non-existent_statement_id",
        user_id: id
      });
    } catch(err) {
      error = err;
    }

    expect(error).toEqual(new GetStatementOperationError.StatementNotFound());
  })
})
