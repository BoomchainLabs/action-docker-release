# create RELEASE.md for all Docker images
This action will create a RELEASE.md based on commits and their attributes.

## Inputs

### `git_log`

**Required**  git log of commits to check

### YML example 
```yml
- name: init / checkout
  uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
  with:
    fetch-depth: 0

- name: git / log
  id: git-log
  run: |
    LOCAL_LAST_TAG=$(git describe --abbrev=0 --tags `git rev-list --tags --skip=1 --max-count=1`)
    LOCAL_COMMITS=$(git log ${LOCAL_LAST_TAG}..HEAD --oneline)

    EOF=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)
    echo "commits<<${EOF}" >> ${GITHUB_OUTPUT}
    echo "${LOCAL_COMMITS}" >> ${GITHUB_OUTPUT}
    echo "${EOF}" >> ${GITHUB_OUTPUT}

- name: github / create RELEASE.md
  uses: 11notes/action-docker-release@v1
  with:
    git_log: ${{ steps.git-log.outputs.commits }}
```