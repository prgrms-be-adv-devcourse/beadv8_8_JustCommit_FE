import { useEffect } from 'react';

const SITE_NAME = 'replant';
const DEFAULT_TITLE = `${SITE_NAME} - 식물 C2C 마켓`;

function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${SITE_NAME} - ${title}` : DEFAULT_TITLE;
  }, [title]);
}

export default usePageTitle;
