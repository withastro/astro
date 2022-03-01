import fs from 'node:fs';
import fetch from 'node-fetch';

if (!process.env.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN env variable must be set to run.');
}
async function main() {
  const [staff, _l3, _l2, _l1] = await Promise.all([
    fetch('https://api.github.com/orgs/withastro/teams/staff/members', {headers: {Authorization: 'token ' + process.env.GITHUB_TOKEN}}).then(r => r.json()),
    fetch('https://api.github.com/orgs/withastro/teams/maintainers-core/members', {headers: {Authorization: 'token ' + process.env.GITHUB_TOKEN}}).then(r => r.json()),
    fetch('https://api.github.com/orgs/withastro/teams/maintainers/members', {headers: {Authorization: 'token ' + process.env.GITHUB_TOKEN}}).then(r => r.json()),
    fetch('https://api.github.com/repos/withastro/astro/contributors?per_page=100', {headers: {Authorization: 'token ' + process.env.GITHUB_TOKEN}}).then(r => r.json()),
  ]);
  const l3 = _l3.filter((a) => !staff.some(b => b.login === a.login));
  const l2 = _l2.filter((a) => !_l3.some(b => b.login === a.login));
  const l1 = _l1.filter((a) => !_l2.some(b => b.login === a.login));


  fs.writeFileSync('src/data/contributors.json', JSON.stringify({staff, l3, l2, l1}));
}

main();