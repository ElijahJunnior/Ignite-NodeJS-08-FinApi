import { hash } from "bcryptjs";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let usersRepository: IUsersRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Authenticate User Use Case", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
  })

  it("Should be able to authenticate user", async () => {
    const email = "test.user@test.com";
    const password = "password123";
    const password_hash = await hash(password, 8);

    await usersRepository.create({
      email,
      name: "Test User",
      password: password_hash,
    });

    const auth = await authenticateUserUseCase.execute({
      email, password
    });

    expect(auth).toHaveProperty("token");
  })

  it("Should not be able to authenticate user with incorrect email", async () => {
    let error;

    try {
      const password = "password123";
      const password_hash = await hash(password, 8);

      await usersRepository.create({
        email: "test.user@test.com",
        name: "Test User",
        password: password_hash
      });

      await authenticateUserUseCase.execute({
        email: "incorrect@test.com",
        password
      });
    } catch(err) {
      error = err;
    }

    expect(error).toEqual(new IncorrectEmailOrPasswordError());
  })

  it("Should not be able to authenticate user with incorrect password", async () => {
    let error;

    try {
      const password_hash = await hash("password123", 8);
      const email = "test.user@test.com";

      await usersRepository.create({
        email,
        name: "Test User",
        password: password_hash
      });

      await authenticateUserUseCase.execute({
        email,
        password: "incorrect"
      });
    } catch(err) {
      error = err;
    }

    expect(error).toEqual(new IncorrectEmailOrPasswordError());
  })
})
