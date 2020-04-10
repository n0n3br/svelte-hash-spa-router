<script>
  import Router from "../../src/Router.svelte";
  import Main from "./Main.svelte";
  import About from "./About.svelte";
  import Posts from "./Posts.svelte";
  import Post from "./Post.svelte";

  const routes = [
    { name: "main", path: "/", component: Main },
    { name: "about", path: "/about", component: About },
    { name: "posts", path: "/posts", component: Posts },
    { name: "post", path: "/post/:id", component: Post }
  ];
</script>

<Router {routes} />
