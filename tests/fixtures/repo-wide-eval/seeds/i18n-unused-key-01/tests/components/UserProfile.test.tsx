import { render } from '@testing-library/react';
import { UserProfile } from '../../src/components/UserProfile';

test('renders user name', () => {
  render(<UserProfile />);
  // Placeholder: real assertions live in the host project. The seed only
  // demonstrates that a corresponding test file exists in the heuristic
  // path so collectRepoContext picks it up.
});
