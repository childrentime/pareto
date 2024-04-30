import { createStore, useStore } from "zustand";
import { fetchJson } from "../../utils";
import { useContext } from "react";
import { zustandContext } from "../../lib/zustand";

export type Repositories = {
  name: string;
  avatar: string;
}[];

export interface HomeStoreInterface {
  repositories: Repositories;
  setRepositories: (repositories: Repositories) => void;
}

export const createHomeStore = async (initialState: Partial<HomeStoreInterface> = {}) => {
  const remoteState: Partial<HomeStoreInterface> = {};
  if(typeof window === "undefined") {
    const { repositories } = await fetchJson("/api/repositories");
    remoteState.repositories = repositories;
  }
  return createStore<HomeStoreInterface>()((set, get) => {
    return {
      repositories: [],
      setRepositories: (repositories) => set({ repositories }),
      ...remoteState,
      ...initialState,
    };
  });
};

export const useHomeStore = <T>(
  selector: (store: HomeStoreInterface) => T
): T => {
  const homeStoreContext = useContext(zustandContext);

  if (!homeStoreContext) {
    throw new Error(`useHomeStore must be use within ZustandProvider`);
  }
  return useStore(homeStoreContext, selector as any);
};
