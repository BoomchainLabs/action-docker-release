const fs = require('node:fs');
const { inspect } = require('node:util');
const core = require('@actions/core');

class RELEASE{
  #list = {
    feature:[],
    fix:[],
    upgrade:[],
    breaking:[],
    cut:[],
  };

  #types = {
    feature:{title:'# 🪄 Feature'},
    fix:{title:'# 🩹 Fix'},
    upgrade:{title:'# 🚀 Upgrade'},
    breaking:{title:'# 🚨 Breaking'},
    cut:{title:'# ✂️ Cut'},
  }
  
  constructor(opt = {}){
    this.#parseInputs(opt);
  }

  #parseInputs(opt){
    core.info(inspect(opt, {showHidden:true, depth:null}));
    if(opt?.git_log){
      
    }
  }
}

try{
  const release = new RELEASE({
    git_log:core.getInput('git_log') || null,
  });
}catch(err){
  core.error(inspect(err, {showHidden:true, depth:null}));
  core.setFailed(`action failed with error ${err.message}`);
}