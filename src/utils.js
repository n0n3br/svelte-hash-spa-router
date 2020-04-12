export const makeHash = (route, params) =>
  !route.path
    ? ""
    : route.path
        .split("/")
        .map((r) => {
          if (!r.length) return "";
          if (r.slice(0, 1) != ":") return r;
          if (!params[r.slice(1)]) {
            throw new Error(
              `svelte-hash-spa-router : route ${
                route.name || route.path
              } expects param ${r.slice(1)} to be defined`
            );
            return "";
          }
          return params[r.slice(1)];
        })
        .join("/");

export const makeQuery = (query) =>
  !Object.keys(query).length
    ? ""
    : "?" +
      Object.keys(query)
        .map((key) => key + "=" + query[key])
        .join("&");
