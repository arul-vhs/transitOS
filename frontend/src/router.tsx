import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    dehydrate: () => {
      return {
        queryClientState: dehydrate(queryClient) as any,
      };
    },
    hydrate: (dehydrated: any) => {
      hydrate(queryClient, dehydrated.queryClientState);
    },
  });

  return router;
};
