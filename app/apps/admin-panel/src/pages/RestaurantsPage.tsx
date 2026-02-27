import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

export const RestaurantsPage = (): ReactElement => {
  return <Navigate to="/floor-editor" replace />;
};
