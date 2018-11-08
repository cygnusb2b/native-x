import 'bootstrap';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ApolloProvider } from 'react-apollo';
import { Helmet } from 'react-helmet';
import Nav from './components/Nav';
import Home from './containers/Home';
import Story from './containers/Story';
import NotFound from './containers/NotFound';
import client from './client';

const App = () => (
  <div>
    <Helmet>
      <title>Fortnight!</title>
    </Helmet>
    <Nav
      brandName="Firehouse.com"
      url="https://www.firehouse.com"
      imgSrc="https://cdn.firehouse.com/files/base/cygnus/fhc/image/static/logo/site_logo.png"
    />
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/:id([0-9]{8})" component={Story} />
      <Route component={NotFound} />
    </Switch>
  </div>
);

ReactDOM.render(
  (
    <Router>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </Router>
  ),
  document.getElementById('app'),
);
