const fs = require('node:fs');
const { inspect } = require('node:util');
const core = require('@actions/core');
const _exec = require('@actions/exec');

const exec = async(bin, arg=[], stripCRLF=true) => {
  let stdout = '';
  let stderr = '';

  const options = {
    listeners:{
      stdout:(data) => {
        stdout += data.toString();
      },
      stderr:(data) => {
        stderr += data.toString();
      }
    }
  };

  try{
    await _exec.exec(bin, arg, options);
  }catch(e){
    core.warning(`exec [${bin}] exception: ${e}`);
    return(false);
  }
  if(stderr.length > 0){
    core.warning(`exec [${bin}] exited with error: ${stderr}`);
    return(false);
  }
  if(stripCRLF){
    stdout = stdout.replace(/[\r\n]*/g, '');
  }
  return(stdout);
};

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
    undefined:{title:'undefined', list:[]},
  }
  
  constructor(opt = {}){
    (async()=>{
      await this.#parseCommits();
      this.#create();
    })();    
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
    return('undefined');
  }

  async #parseCommits(opt){
    try{
      const commit = await exec('git', ['rev-list', '--tags', '--skip=1', '--max-count=1']);
      if(commit){
        const tag = await exec('git ', ['describe', '--abbrev=0', commit]);
        const commits = await exec('git', ['log', `${commit}..HEAD`, '--oneline'], false);
        if(commits){
          const aMatches = [...commits.matchAll(/(\S{7}) ([^:]+): (.+)/igm)];
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
      }
    }catch(e){
      core.warning(`exception: ${inspect(e, {showHidden:false, depth:null})}`);
    }
  }

  #create(){
    const release = [];
    for(const type in this.#types){
      if(type != 'undefined' && this.#types[type].list.length > 0){
        release.push(`# ${this.#types[type].title}`);
        for(const row of this.#types[type].list){
          release.push(row);
        }
        release.push("");
      }
    }

    if(this.#types['undefined'].list.length > 0){
      core.warning(`undefined has entries: ${inspect(this.#types['undefined'].list, {showHidden:false, depth:null})}`);
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
  const release = new RELEASE();
}catch(err){
  core.error(inspect(err, {showHidden:false, depth:null}));
  core.setFailed(`action failed with error ${err.message}`);
}