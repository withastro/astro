import { h } from 'preact';

export default function CompanyLogo({ user }) {
  return (
    <a href={user.url} target="_blank" rel="noopener noreferrer nofollow">
      {user.img ? (
        <img class="company-logo" src={user.img} alt={user.name} />
      ) : (
        <span>{user.name}</span>
      )}
    </a>
  );
}
