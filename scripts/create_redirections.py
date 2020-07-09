'''
This script creates HTTP redirections for those routes defined in the module
variable REDIRECTIONS.
'''

import os
import sys

overwrite_option = '--overwrite'

# Add keys and pairs where:
#   - The key is the old absolute URL. Discard the baseurl and the leading slash.
#   - The value is the new URL relative to the old one.
REDIRECTIONS = {
    'ch-prerequisites/linear_algebra.html': '../../ch-appendix/linear_algebra.html'
}

def create_redirection (buildpath, old, new, overwrite=False):
    '''
    Creates a HTML redirection.
    '''
    redirectionpath = os.path.join(buildpath, old)
    redirectioncontent = f'<head><meta http-equiv="Refresh" content="0; URL={new}"></head>'
    if os.path.exists(redirectionpath) and not overwrite:
        print(f'File `{redirectionpath}` already exists. Pass {overwrite_option} to force overwritting.')
        return

    folder = os.path.dirname(redirectionpath)
    os.makedirs(folder, exist_ok=True)
    with open(redirectionpath, 'w') as file_:
        print(f'Creating redirection at {redirectionpath} -> {new} ')
        file_.write(redirectioncontent)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(f'Usage: python3 create_redirections.py [{overwrite_option}] <build-dir>')

    overwrite = sys.argv[1] == overwrite_option
    base_dir = sys.argv[1] if not overwrite else sys.argv[2]
    for (old, new) in REDIRECTIONS.items():
        create_redirection(base_dir, old, new, overwrite=overwrite)
