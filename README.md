# create RELEASE.md for all Docker images
This action will create release markdown based on commits and their attributes.
## Inputs

### `git_log`

**Required**  git log of commits to check

### YML example 
```yml
  # fetch-depth: 0 is needed to fetch tags
- name: init / checkout
  uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
  with:
    fetch-depth: 0

  # will get the last tag and all commits between this tag and the ref:tag
  # can't be done via octokit, so it must be done as pure git run
- name: github / release / log
  id: git-log
  run: |
    LOCAL_LAST_TAG=$(git describe --abbrev=0 --tags `git rev-list --tags --skip=1 --max-count=1`)
    echo "using last tag: ${LOCAL_LAST_TAG}"
    LOCAL_COMMITS=$(git log ${LOCAL_LAST_TAG}..HEAD --oneline)

    EOF=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)
    echo "commits<<${EOF}" >> ${GITHUB_OUTPUT}
    echo "${LOCAL_COMMITS}" >> ${GITHUB_OUTPUT}
    echo "${EOF}" >> ${GITHUB_OUTPUT}

  # call actual action with correct commit data
- name: github / release / markdown
  id: git-release
  uses: 11notes/action-docker-release@v1
  with:
    git_log: ${{ steps.git-log.outputs.commits }}

  # create a new release with the markdown and the ref:tag
- name: github / release / create
  if: steps.git-release.outcome == 'success'
  uses: actions/create-release@4c11c9fe1dcd9636620a16455165783b20fc7ea0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    tag_name: ${{ github.ref }}
    release_name: ${{ github.ref }}
    body: ${{ steps.git-release.outputs.release }}
    draft: false
    prerelease: false
```