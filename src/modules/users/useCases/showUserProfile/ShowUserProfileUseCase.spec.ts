import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let usersRepository: IUsersRepository;
let showUserProfileUseCase: ShowUserProfileUseCase;

describe("Show User Profile Use Case", () => {
  beforeEach(()=> {
    usersRepository = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepository);
  })

  it("Should be able to return the data of an existing user", async () => {
    const userCreated = await usersRepository.create({
      email: "user.test@finapi.com",
      name: "User Test",
      password: "password123"
    });

    const userReturned = await showUserProfileUseCase.execute(
      userCreated.id as string
    );

    expect(userReturned).toEqual(userCreated);
  })

  it("shouldn't be able to return data from a user that doesn't exist", async () => {
    let error;

    try {
      await showUserProfileUseCase.execute("not_exists_user_id");
    } catch (err) {
      error = err;
    }

    expect(error).toEqual(new ShowUserProfileError());
  })
})
