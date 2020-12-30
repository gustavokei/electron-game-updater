import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Switch, Route } from "react-router-dom";
import WindowLoader from "./window-loader";
import WindowPatcher from "./window-patcher";

ReactDOM.render(
  <HashRouter>
    <Switch>
      <Route exact path="/" component={WindowPatcher} />
      <Route exact path="/loader" component={WindowLoader} />
    </Switch>
  </HashRouter>,
  document.getElementById("app")
);
