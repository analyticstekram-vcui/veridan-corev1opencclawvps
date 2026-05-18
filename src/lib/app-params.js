const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getSafeFromUrl = () => {
	// Remove the old oversized key first
	try {
		storage.removeItem('base44_from_url');
	} catch (e) {
		// Continue even if removal fails
	}
	
	// Create a safe URL using only pathname and search
	let safeUrl = window.location.pathname + window.location.search;
	
	// If pathname is empty, use "/"
	if (!safeUrl || safeUrl === '') {
		safeUrl = '/';
	}
	
	// If still too long, use only pathname (max length guard)
	if (safeUrl.length > 1000) {
		safeUrl = window.location.pathname || '/';
	}
	
	return safeUrl;
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		try {
			storage.setItem(storageKey, searchParam);
		} catch (e) {
			// Storage quota exceeded, continue without storing
		}
		return searchParam;
	}
	if (defaultValue) {
		try {
			storage.setItem(storageKey, defaultValue);
		} catch (e) {
			// Storage quota exceeded, continue without storing
		}
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: getSafeFromUrl() }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}