import { makeAutoObservable } from "mobx";
import { fetchJson } from "../../utils";

export type Repositories = {
  name: string;
  avatar: string;
}[];

class HomeStore {
  repositories: Repositories = [];

  async getInitialProps(): Promise<void> {
    const promiseArr: Promise<any>[] = [this.fetchRepositories()];
    await Promise.all(promiseArr);
  }

  fetchRepositories = async () => {
    const { repositories } = await fetchJson("/api/repositories");
    this.repositories = repositories;
  };

  constructor() {
    makeAutoObservable(this);
  }

  hydrate(data: {
    repositories: Repositories;
  }) {
    this.repositories = data.repositories;
  }
}

export default HomeStore;
