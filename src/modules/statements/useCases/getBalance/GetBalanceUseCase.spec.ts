import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let usersRepository: IUsersRepository;
let statementsRepository: IStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;

describe("Get Balance Use Case", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    getBalanceUseCase = new GetBalanceUseCase(statementsRepository, usersRepository);
  })

  it("Should be able to get a user's balance", async () => {
    const { id  } = await usersRepository.create({
      email: "user.test@fin-api.com",
      name: "User Test",
      password: "password123"
    }) as { id: string };

    const statement1 = await statementsRepository.create({
      user_id: id,
      amount: 100,
      description: "Test Deposit Statement",
      type: OperationType.DEPOSIT
    });

    const statement2 = await statementsRepository.create({
      user_id: id,
      amount: 200,
      description: "Test Deposit Statement",
      type: OperationType.DEPOSIT
    });

    const statement3 = await statementsRepository.create({
      user_id: id,
      amount: 150,
      description: "Test Withdraw Statement",
      type: OperationType.WITHDRAW
    });

    const resultReceived = await getBalanceUseCase.execute({user_id: id});

    const resultExpected = {
      statement: [
        statement1,
        statement2,
        statement3,
      ],
      balance: 150,
    };

    expect(resultReceived).toEqual(resultExpected);
  })

  it("Shouldn't be able to get a non-existent user's balance", async () => {
    let error;

    try {
      await getBalanceUseCase.execute({ user_id: "non-existent_user_id" });
    } catch (err) {
      error = err;
    }

    expect(error).toEqual(new GetBalanceError());
  })

  it("Should be able to get a user's balance after they send a transfer", async () => {
    const { id: sender_id  } = await usersRepository.create({
      email: "sender@fin_api.com",
      name: "Sender User",
      password: "password123"
    }) as { id: string };

    const { id: recipient_id  } = await usersRepository.create({
      email: "recipient@fin_api.com",
      name: "Recipient User",
      password: "password123"
    }) as { id: string };

    const statement1 = await statementsRepository.create({
      user_id: sender_id,
      amount: 200,
      description: "Initial balance statement",
      type: OperationType.DEPOSIT
    });

    const statement2 = await statementsRepository.create({
      user_id: recipient_id,
      amount: 100,
      description: "Transfer statement",
      type: OperationType.TRANSFER,
      sender_id
    });

    const resultReceived = await getBalanceUseCase.execute({user_id: sender_id});

    const resultExpected = {
      statement: [
        statement1,
        statement2,
      ],
      balance: 100,
    };

    expect(resultReceived).toEqual(resultExpected);
  })

  it("Should be able to get a user's balance after they receive a transfer", async () => {
    const { id: sender_id  } = await usersRepository.create({
      email: "sender@fin_api.com",
      name: "Sender User",
      password: "password123"
    }) as { id: string };

    const { id: recipient_id  } = await usersRepository.create({
      email: "recipient@fin_api.com",
      name: "Recipient User",
      password: "password123"
    }) as { id: string };

    const statement1 = await statementsRepository.create({
      user_id: sender_id,
      amount: 200,
      description: "Initial balance statement",
      type: OperationType.DEPOSIT
    });

    const statement2 = await statementsRepository.create({
      user_id: recipient_id,
      amount: 100,
      description: "Transfer statement",
      type: OperationType.TRANSFER,
      sender_id
    });

    const resultReceived = await getBalanceUseCase.execute({user_id: recipient_id});

    const resultExpected = {
      statement: [
        statement2,
      ],
      balance: 100,
    };

    expect(resultReceived).toEqual(resultExpected);
  })
})
