const fs = require('node:fs');
const { inspect } = require('node:util');
const core = require('@actions/core');

class RELEASE{
  #types = {
    breaking:{title:'# 🚨 Breaking'},
    fix:{title:'# 🩹 Fix'},
    feature:{title:'# 🪄 Feature'},
    upgrade:{title:'# 🚀 Upgrade'},
    cut:{title:'# ✂️ Cut'},
    comment:{title:'# ⌨️ Comment'},

    unsorted:{title:'# 💀 Unsorted'}
  }

  #list = {};
  #regExp = {
    log:null
  };
  #log = '';
  
  constructor(opt = {}){
    const a = [];
    for(const type in this.#types){
      this.#list[type] = [];
      a.push(type);
    }

    this.#regExp.log = new RegExp(`^(\\S{7})\\s+\\[(${a.join('|')})\\]\\s+(.+)\\s*`, 'igm');
    this.#regExp.unsorted = new RegExp(`^(\\S{7})\\s+(?!\\[(${a.join('|')})\\]\\s+)(.+)\\s*`, 'igm');

    this.#parseInputs(opt);
    this.#create();
  }

  #parseInputs(opt){
    if(opt?.git_log){
      this.#log = `${opt.git_log}`;

      const aMatches = [...this.#log.matchAll(this.#regExp.log)];
      if(aMatches && aMatches.length > 0){
        for(const match of aMatches){
          const log = {
            hash:match[1],
            type:`${match[2]}`.toLowerCase(),
            message:match[3],
          }
          this.#list[log.type].push(`* ${log.message} - ${log.hash}`);
        }
      }

      const aMatchesUnsorted = [...this.#log.matchAll(this.#regExp.unsorted)];
      if(aMatchesUnsorted && aMatchesUnsorted.length > 0){
        for(const match of aMatchesUnsorted){
          const log = {
            hash:match[1],
            message:match[2],
          }
          this.#list.unsorted.push(`* ${log.message} - ${log.hash}`);
        }
      }
    }
  }

  #create(){
    const release = [];
    for(const type in this.#list){
      if(this.#list[type].length > 0){
        release.push(`${this.#types[type].title}`);
        for(const row of this.#list[type]){
          release.push(row);
        }
        release.push("");
      }
    }

    if(release.length > 0){
      core.exportVariable('WORKFLOW_GITHUB_RELEASE', 'true');
      core.setOutput('release', release.join("\r\n"));
    }else{
      core.exportVariable('WORKFLOW_GITHUB_RELEASE', 'false');
    }
  }
}

try{
  const release = new RELEASE({
    git_log:core.getInput('git_log') || null,
  });
}catch(err){
  core.error(inspect(err, {showHidden:false, depth:null}));
  core.setFailed(`action failed with error ${err.message}`);
}