import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

// access to Provider and Consumer
// can access using GithubContext.Provider

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  //request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  //erroe
  const [error, setError] = useState({ show: false, msg: "" });

  //
  const searchGithubUser = async (user) => {
    //toggle error
    toggleError(); // already predefined to be false
    //setloading true
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    console.log(user);
    console.log(response);
    if (response) {
      setGithubUser(response.data);
      //repos
      const { login, followers_url } = response.data;
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) =>
      //   setRepos(response.data)
      // );

      // axios(`${followers_url}?per_page=100`).then((response) =>
      //   setFollowers(response.data)
      // );

      // doing this so that we show all the data at one on the page
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          const status = "fulfilled";
          if (repos.status == status) {
            setRepos(repos.value.data);
          }
          if (followers.status == status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, "No Such User Found");
    }
    checkRequests();
    setIsLoading(false);
  };
  //check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        // remaining = 0;
        setRequests(remaining);
        if (remaining == 0) {
          //throw an error
          toggleError(true, "Limit Exceeded");
        }
      })
      .catch((err) => console.log(err));
  };
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  //error
  useEffect(checkRequests, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
