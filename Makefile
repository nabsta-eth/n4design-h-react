# Ensures all packages are up to date (checked out at the latest master/dev)
# and linked locally.
checkout-sync-link: checkout-sync-link-components checkout-sync-link-sdk checkout-sync-link-react

checkout-sync-link-sdk:
	cd ../handle-sdk && \
	git stash && \
	git checkout master && \
	git fetch origin && \
	git reset --hard origin/master && \
	pnpm build && \
	pnpm link --global

checkout-sync-link-components:
	cd ../react-components && \
	git stash && \
	git checkout master && \
	git fetch origin && \
	git reset --hard origin/master && \
	pnpm build && \
	pnpm link --global

checkout-sync-link-react:
	git stash && \
	git checkout develop && \
	git fetch origin && \
	git reset --hard origin/develop && \
	pnpm link --global handle-sdk && \
	pnpm link --global @handle-fi/react-components
