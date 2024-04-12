/** To config a DBStorage. */
export interface DBStoreOptions {
	name: string
	keyPath?: string | string[]
	autoIncrement?: boolean
}


/** Cache data using `indexedDB`. */
export class DBStorage {

	/** Database name. */
	private name: string

	/** Database version. */
	private version: number

	/** Database options, can only add (must version plus) and can't modify existing. */
	private storeOptions: DBStoreOptions[]

	/** Database. */
	private db: IDBDatabase | null = null

	/** Opening Database promise. */
	private openPromise: Promise<IDBDatabase> | null = null

	private cachedSupported: boolean | null = null

	constructor(name: string, version: number, storeOptions: DBStoreOptions[]) {
		this.name = name
		this.version = version
		this.storeOptions = storeOptions
	}

	/** Check whether supported indexedDB. */
	async isSupported(): Promise<boolean> {
		if (this.cachedSupported !== null) {
			return this.cachedSupported
		}

		if (!window.indexedDB) {
			return false
		}

		try {
			await this.getDB()
			return this.cachedSupported = true
		}
		catch (err) {
			return this.cachedSupported = false
		}
	}

	/** Whether database in opening state. */
	get opening() {
		return !this.db && this.openPromise
	}

	/** Whether have opened database. */
	get opened() {
		return !!this.db
	}

	/** Close database connection. */
	async close() {
		if (this.opened) {
			this.db!.close()
			this.db = null
		}
		else if (this.opening) {
			(await this.getDB())?.close()
			this.db = null
		}
	}

	/** Get database connection, will open if not yet. */
	async getDB(): Promise<IDBDatabase | null> {
		if (this.db) {
			return this.db
		}

		if (this.openPromise) {
			return this.openPromise
		}

		let request = indexedDB.open(this.name, this.version)
		let timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 500)) as Promise<null>
		this.openPromise = this.handleOpenDBRequest(request)

		this.db = await Promise.any([this.openPromise, timeoutPromise])
		this.openPromise = null

		return this.db
	}

	/** Package Request object to Promise. */
	private handleOpenDBRequest(request: IDBOpenDBRequest): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			request.onupgradeneeded = () => {
				this.updateStores(request.result)
			}

			request.onsuccess = function() {
				resolve(request.result)
			}

			request.onerror = reject
		}) as Promise<IDBDatabase>
	}

	/** Update store data structure. */
	private updateStores(db: IDBDatabase) {

		// Created not existing.
		for (let option of this.storeOptions) {
			if (!db.objectStoreNames.contains(option.name)) {
				db.createObjectStore(option.name, option)
			}
		}

		// Delete existing but not specified in options.
		for (let existingName of db.objectStoreNames) {
			if (!this.storeOptions.find(option => option.name === existingName)) {
				db.deleteObjectStore(existingName)
			}
		}
	}

	/** Get store by name. */
	async getStore(storeName: string): Promise<DBStore | null> {
		if (!this.isSupported()) {
			return null
		}

		return new DBStore(storeName, this)
	}
}


/** Handle a database store. */
export class DBStore<T = any> {

	/** Store name. */
	private name: string 

	/** Database connection. */
	private connection: DBStorage

	constructor(name: string, connection: DBStorage) {
		this.name = name
		this.connection = connection
	}

	/** 
	 * Make a transaction to do querying.
	 * Must query immediately, on iOS even wait for a Promise Tick will cause error.
	 */
	private async makeTransactionQuery<T>(mode: IDBTransactionMode, query: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
		let db = await this.connection.getDB()
		if (!db) {
			throw new Error(`Can't open indexedDB!`)
		}

		let transaction = db.transaction([this.name], mode)
		let store = transaction.objectStore(this.name)
		let request = query(store)
		
		return await this.requestToPromise(request)
	}

	/** Package Request object to Promise. */
	private requestToPromise<T = any>(request: IDBRequest<T>) {
		return new Promise((resolve, reject) => {
			request.onsuccess = function(){resolve(request.result)}
			request.onerror = reject
		}) as Promise<T>
	}
	
	/** Whether have specifed key. */
	async has(key: string): Promise<boolean> {
		return (await this.count(key)) > 0
	}

	/** Get key count. */
	async count(key: string): Promise<number> {
		return await this.makeTransactionQuery('readonly', store => store.count(key))
	}

	/** Get the first value by key. */
	async get(key: string): Promise<T> {
		return await this.makeTransactionQuery('readonly', store => store.get(key))
	}

	/** Get all the values by key. */
	async getAll(key: string): Promise<T[]> {
		return await this.makeTransactionQuery('readonly', store => store.getAll(key))
	}

	/** Get all the key list. */
	async getAllKeys(): Promise<string[]> {
		return await this.makeTransactionQuery('readonly', store => store.getAllKeys()) as string[]
	}

	/** 
	 * Delete all the values by key.
	 * Returns whether delete successfully.
	 */
	async delete(key: string): Promise<boolean> {
		await this.makeTransactionQuery('readwrite', store => store.delete(key))
		return true
	}

	/** 
	 * Add a value and it's key,
	 * Returns the key in database.
	 */
	async add(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
		return await this.makeTransactionQuery('readwrite', store => store.add(value, key))
	}
	
	/** 
	 * Remove all the values by key and then add a value and it's indexed key,
	 * Returns the key in database.
	 */
	async put(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
		return await this.makeTransactionQuery('readwrite', store => store.put(value, key))
	}

	/** Clear all the data in store. */
	async clear(): Promise<boolean> {
		await this.makeTransactionQuery('readwrite', store => store.clear())
		return true
	}
}