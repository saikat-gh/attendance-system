import requests

# Replace with your Docker Hub username and access token
USERNAME = 'arjunref'
TOKEN = 'dckr_pat_K848l8W8_kb_bZaQaI3-tSPyRw0'

# Docker Hub API endpoint
BASE_URL = "https://hub.docker.com/v2"

# Get the list of repositories
def get_repositories():
    url = f"{BASE_URL}/repositories/{USERNAME}/"
    repos = []
    while url:
        headers = {'Authorization': f'Bearer {TOKEN}'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        repos.extend(data['results'])
        url = data['next']  # Next page URL (if available)
    return repos

# Update repository visibility
def set_repository_private(repo_name):
    try:
        url = f"{BASE_URL}/repositories/{USERNAME}/{repo_name}/"
        response = requests.patch(
            url, json={"is_private": True}, auth=(USERNAME, TOKEN)
        )
        response.raise_for_status()
        print(f"Updated {repo_name} to private.")
        return True
    except requests.exceptions.HTTPError as e:
        print(f"Error updating {repo_name}: {str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected error with {repo_name}: {str(e)}")
        return False

def main():
    try:
        repositories = get_repositories()
        for repo in repositories:
            if not repo['is_private']:
                success = set_repository_private(repo['name'])
                if not success:
                    print(f"Skipping to next repository after error with {repo['name']}")
                    continue
            else:
                print(f"{repo['name']} is already private.")
    except Exception as e:
        print(f"Fatal error: {str(e)}")

if __name__ == "__main__":
    main()
