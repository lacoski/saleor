import * as React from "react";

import { UserFragment } from "../gql-types";
import {
  getAuthToken,
  removeAuthToken,
  setAuthToken,
  UserContext
} from "./index";

import TokenAuthProvider from "./containers/TokenAuth";
import TokenVerifyProvider from "./containers/TokenVerify";

const AuthProviderOperations: React.StatelessComponent<any> = ({
  children,
  onError
}) => {
  return (
    <TokenAuthProvider onError={onError}>
      {tokenAuth => (
        <TokenVerifyProvider onError={onError}>
          {tokenVerify => (
            <AuthProvider tokenAuth={tokenAuth} tokenVerify={tokenVerify}>
              {({ isAuthenticated }) => {
                return children({ isAuthenticated });
              }}
            </AuthProvider>
          )}
        </TokenVerifyProvider>
      )}
    </TokenAuthProvider>
  );
};

interface AuthProviderProps {
  children: any;
  tokenAuth: any;
  tokenVerify: any;
}

interface AuthProviderState {
  user: UserFragment;
}

class AuthProvider extends React.Component<
  AuthProviderProps,
  AuthProviderState
> {
  constructor(props) {
    super(props);
    this.state = { user: undefined };
  }

  componentWillReceiveProps(props: AuthProviderProps) {
    const { tokenAuth, tokenVerify } = props;
    if (tokenAuth.error || tokenVerify.error) {
      this.logout();
    }
    if (tokenAuth.data) {
      this.setState({ user: tokenAuth.data.tokenCreate.user });
      setAuthToken(tokenAuth.data.tokenCreate.token);
    }
    if (tokenVerify.data) {
      this.setState({ user: tokenVerify.data.tokenVerify.user });
    }
  }

  componentDidMount() {
    const { user } = this.state;
    const { tokenVerify } = this.props;
    const token = getAuthToken();
    if (!!token && !user) {
      tokenVerify.mutate({ variables: { token } });
    }
  }

  login = (email: string, password: string) => {
    const { tokenAuth } = this.props;
    tokenAuth.mutate({ variables: { email, password } });
  };

  logout = () => {
    this.setState({ user: undefined });
    removeAuthToken();
  };

  render() {
    const { children, tokenAuth, tokenVerify } = this.props;
    const { user } = this.state;
    const isAuthenticated = !!user;
    const loading = tokenAuth.loading || tokenVerify.loading;
    return (
      <UserContext.Provider
        value={{ user, login: this.login, logout: this.logout }}
      >
        {/* FIXME: render lodaing state properly */}
        { loading ? <div>Loading...</div> : children({ isAuthenticated }) }
      </UserContext.Provider>
    );
  }
}

export default AuthProviderOperations;