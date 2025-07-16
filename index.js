const fs = require('node:fs');
const { inspect } = require('node:util');
const core = require('@actions/core');
const exec = require('@actions/exec');

class RELEASE{
  #types = {
    breaking:{title:'🚨 Breaking Changes', list:[]},
    feat:{title:'✨ New Features', list:[]},
    fix:{title:'🐛 Bug Fixes', list:[]},
    chore:{title:'🔧 Chores', list:[]},
    docs:{title:'📄 Documentation', list:[]},
    refactor:{title:'🔮 Refactoring', list:[]},
    cut:{title:'✂️ Removed', list:[]},
    perf:{title:'⏰ Performance Improvements', list:[]},
    revert:{title:'🔄 Undo Changes', list:[]},
    style:{title:'🖌 Style Changes', list:[]},
    test:{title:'🧨 Tests', list:[]},
  }
  
  constructor(opt = {}){
    this.#parseInputs(opt);
    this.#create();
  }

  #typeToTypes(type){
    if(type.match(/\!/i)){
      return('breaking');
    }else{
      for(const key in this.#types){
        if(type.match(new RegExp(key, 'i'))){
          return(`${key}`);
        }
      }
    }
  }

  #parseInputs(opt){
    if(opt?.git_log){      
      const aMatches = [...`${opt.git_log}`.matchAll(/(\S{7}) ([^:]+): (.+)/igm)];
      if(aMatches && aMatches.length > 0){
        for(const match of aMatches){
          const log = {
            hash:match[1],
            type:`${match[2]}`.toLowerCase(),
            message:match[3],
          }
          this.#types[this.#typeToTypes(log.type)].list.push(`* ${log.hash} - ${log.message}`);
        }
      }
    }

    (async()=>{
      const tag = await exec.exec('git', ['rev-list', '--tags', '--skip=1', '--max-count=1']);
      core.info(tag);
      const commits = await exec.exec('git', ['describe', '--abbrev=0', '--tags', tag]);
      core.info(inspect(commits, {showHidden:false, depth:null}));
    })();
  }

  #create(){
    const release = [];
    for(const type in this.#types){
      if(this.#types[type].list.length > 0){
        release.push(`# ${this.#types[type].title}`);
        for(const row of this.#types[type].list){
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
  const example = `d062133 fix(CI/CD)!: removal of armv7 as non-standard deployment option
d4d8334 Merge branch 'master' of https://github.com/11notes/docker-netbird
2a2de68 feat: 11notes/go as build image
2016f96 feat: new postgres image and yml anchor
578132e chore: change UVP
57eb9f3 Merge branch 'master' of https://github.com/11notes/docker-netbird
6279ff8 [upgrade] latest workflows`;
  const release = new RELEASE({
    git_log:core.getInput('git_log') || example,
  });
}catch(err){
  core.error(inspect(err, {showHidden:false, depth:null}));
  core.setFailed(`action failed with error ${err.message}`);
}