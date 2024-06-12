import NodeCache from "node-cache";
const cache = new NodeCache();


class Storage {

    setKey = (key, value) => {
        try {
            const response = cache.set(key, value,70);
            //delete in 70 seconds
            // console.log("key set successfully for...", key)
        } catch (error) {
            console.log(error);
        }
    }

    getKey = (key) => {
        try {
            let value = cache.get(key);
            // console.log("key retrieved for ",key)
            return value;
        } catch (error) {
            console.log("Error Saving Redis.")
        }
    }

    removeKey = (key) => {
        try {
            cache.del(key)
            console.log("key removed")
        } catch (error) {
            console.log("Error removing Redis.", error)
        }
    }

    isKeyExists = (key) => {
        try {
            return cache.has(key)
        } catch (error) {
            console.log("Error checking Redis.", error)
        }
    }
}

const storage = new Storage();
Object.freeze(storage);

 const STORAGE_KEYS={
    BET_SUMMARY:'BET_SUMMARY',
    DERIEVED:'DERIEVED',
    CURRENT_CONTEST:'CURRENT_CONTEST',
    CONTEST_JUST_ENDED:'CONTEST_JUST_ENDED',
 }


 export {
    storage,
    STORAGE_KEYS
 }
 