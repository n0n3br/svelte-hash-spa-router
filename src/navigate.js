import { store } from "./Router.svelte";
import { get } from "svelte/store";
import { makeHash, makeQuery } from "./utils";
export default (to, params = {}, query = {}) => {
  if (!to)
    throw new Error(
      "svelte-hash-spa-router navigate method expects 'to' to be defined"
    );
  const routes = get(store).routes;
  const route = routes.find((r) => r.name === to || r.path === to) || {};
  if (!route)
    throw new Error(`svelte-hash-spa-router route '${to}' is not valid`);
  location.hash = "#" + makeHash(route, params) + makeQuery(query);
};
