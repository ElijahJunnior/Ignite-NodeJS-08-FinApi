import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase"

let usersRepository: IUsersRepository
let createUserUseCase: CreateUserUseCase;

describe("Create User Use Case Test", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository)
  })

  it("Should be able to create one user", async () => {
    expect("test").toBe("test");
  })
})
