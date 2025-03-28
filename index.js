const fs = require('node:fs');
const { inspect } = require('node:util');
const core = require('@actions/core');

class RELEASE{
  #types = {
    breaking:{title:'# 🚨 Breaking'},
    break:{ref:'breaking'},
    fix:{title:'# 🩹 Fix'},
    feature:{title:'# 🪄 Feature'},
    add:{ref:'feature'},
    upgrade:{title:'# 🚀 Upgrade'},
    update:{ref:'upgrade'},
    cut:{title:'# ✂️ Cut'},
    remove:{ref:'cut'},
    del:{ref:'cut'},
    comment:{title:'# ⌨️ Comment'},
    unsorted:{title:'# 💀 Unsorted'}
  }

  #list = {};
  #regExp = {
    log:null,
    unsorted:null,
    blacklist:null,
  };
  #log = '';
  #blacklist = [
    `merge branch 'master'`,
    `auto update README\\.md`,
  ]
  
  constructor(opt = {}){
    const aTypes = [];
    for(const type in this.#types){
      this.#list[type] = [];
      aTypes.push(type);
    }

    const aBlacklist = [];
    for(const ignore of this.#blacklist){
      aBlacklist.push(ignore);
    }

    this.#regExp.log = new RegExp(`^(\\S{7})\\s+\\[(${aTypes.join('|')})\\]\\s+(.+)\\s*`, 'igm');
    this.#regExp.unsorted = new RegExp(`^(\\S{7})\\s+(?!\\[(${aTypes.join('|')})\\]\\s+)(.+)\\s*`, 'igm');
    this.#regExp.blacklist = new RegExp(`(${aBlacklist.join('|')})`, 'i');

    this.#parseInputs(opt);
    this.#create();
  }

  #parseInputs(opt){
    if(opt?.git_log){
      this.#log = `${opt.git_log}`;
      
      const aMatches = [...this.#log.matchAll(this.#regExp.log)];
      if(aMatches && aMatches.length > 0){
        for(const match of aMatches){
          if(!this.#regExp.blacklist.test(match[0])){
            const log = {
              hash:match[1],
              type:`${match[2]}`.toLowerCase(),
              message:match[3],
            }
            if(this.#types[log.type]?.ref){
              log.type = this.#types[log.type].ref;
            }
            this.#list[log.type].push(`* ${log.message} - ${log.hash}`);
          }else{
            core.info(`blacklisted commit ${match[1]} "${match[3]}"`)
          }
        }
      }

      const aMatchesUnsorted = [...this.#log.matchAll(this.#regExp.unsorted)];
      if(aMatchesUnsorted && aMatchesUnsorted.length > 0){
        for(const match of aMatchesUnsorted){
          if(!this.#regExp.blacklist.test(match[0])){
            const log = {
              hash:match[1],
              message:match[3],
            }
            this.#list.unsorted.push(`* ${log.message} - ${log.hash}`);
          }else{
            core.info(`blacklisted commit ${match[1]} "${match[3]}"`)
          }
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