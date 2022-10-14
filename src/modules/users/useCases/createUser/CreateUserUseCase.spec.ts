import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";

let usersRepository: IUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Create User Use Case Test", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
  })

  it("Should be able to create one user", async () => {
    const user = await createUserUseCase.execute({
      name: "Test User",
      email: "test.user@test.com",
      password: "password123"
    });

    expect(user).toHaveProperty("id");
  })

  it("Should not be able to create two or mor user with same e-mail", async () => {
    let error;

    try {
      await createUserUseCase.execute({
        name: "Test User",
        email: "test.user@test.com",
        password: "password123"
      });

      await createUserUseCase.execute({
        name: "Test User",
        email: "test.user@test.com",
        password: "password123"
      });
    } catch(err) {
      error = err;
    }

    expect(error).toEqual(new CreateUserError());
  })
})
