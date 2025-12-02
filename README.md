# ff-kit


## About

**ff-kit** stands for "Frequently-Used Kit Functions", it's a JavaScript utility library providing commonly used functions for Web Programming.

Most modules have none or few dependencies, which means you can easily **tree-shaking**, or just copy them to where they are needed.


## Features

- **Events**
	- **SimulatedEvents**: bind events like:
		- `tap`
		- `double-tap`
		- `hold`
		- `pinch`
		- `slide`

	- **Math**: Do math calculations, especially geometry calculations, includes:
		- `Point`
		- `Vector`
		- `LineSegment`
		- `RadialLine`
		- `Box`
		- `BoxOffsets`
		- `Direction`
		- `Matrix`
		- `Size`
		- `Random`
		- `IntegralLookup`
		- `RecursiveAverage` and `RecursiveVariance`

	- **Structs**: map and weak map structs, includes:
		- **Map**:
			- `ListMap`: `K => V[]`
			- `SetMap`: `K => Set<V>`
			- `PairKeysMap`: `K1 -> K2 -> V`
			- `PairKeysListMap`: `K1 -> K2 -> V[]`
			- `PairKeysSetMap`: `K1 -> K2 -> Set<V>`
			- `TwoWayMap`: `L -> R` and `R -> L`
			- `TwoWayListMap`: `L -> R[]` and `R -> L[]`
			- `TwoWaySetMap`: `L -> Set<R>` and `R -> Set<L>`

		- **WeakMap**:
			- `WeakListMap`: `K => V[]`
			- `WeakSetMap`: `K => Set<V>`
			- `WeakPairKeysMap`: `K1 -> K2 -> V`
			- `WeakPairKeysListMap`: `K1 -> K2 -> V[]`
			- `WeakPairKeysSetMap`: `K1 -> K2 -> Set<V>`
			- `WeakTwoWayMap`: `L -> R` and `R -> L`
			- `WeakTwoWayListMap`: `L -> R[]` and `R -> L[]`
			- `WeakTwoWaySetMap`: `L -> Set<R>` and `R -> Set<L>

	- **Tools**: includes normally tool classes:
		- `AnchorAligner`: do anchor like positioning.
		- `Color`: color parse, formatting and converting.
		- `WebStorage & BiggerStorage`: store json data items into localStorage and indexedDB. 
		- `AsyncTaskQueue`: handle async tasks one by one.
		- `barrierDOMReading & barrierDOMWriting`: To barrier DOM properties reading and writing to reduce document Re-Layout frequency.
		- `BrowserInfo`: platform and browser info.
		- `ListBundler`, `SetBundler`, `EmptyBundler`: Bundle call arguments within a micro task into one.
		- `ClipboardAPIs`: Clipboard APIs.
		- `FullscreenAPIs`: Fullscreen APIs.
		- `Logger & LoggerTimer`: verbose levels of logger, and logger of time cost.
		- `Selections`: handle selection, especially range/ctrl/shift selection.
		- `Settings & StorableSettings`: manage setting items, and may store them.
		- `TaskQueue`: handle async tasks in queue and concurrency.
		- `Timeout & Interval & Throttle & Debounce`: time control classes and functions as their names.
		- `Translations & t`: handle transitions.

	- **Utils**: utility functions:
		- `applyMixins`: supports multiple extends.
		- `range & sleep & noop`: utility functions.
		- `bindCallback`: bind callback with scope and cache it.
		- `DateUtils`: to get and set date parts, and format date.
		- `DOMUtils`: to get node properties.
		- `DurationObject`: do duration computing and formatting.
		- `EventUtils`: get properties and do tests of an event.
		- `HTMLUtils`: convert between html and text, and clean html.
		- `IdUtils`: make different types of ids.
		- `ListUtils`: provides common list operations, searching and sorting.
		- `NumberUtils`: handle number mathematical operations.
		- `ObjectUtils`: can clone or do object assignment.
		- `RegExpUtils`: can escape a string to a RegExp.
		- `ScrollUtils`: can detect scroll direction, get scroll wrapper and scroll offset.
		- `SizeUtils`: format a size to more readable string.
		- `SourceUtils`: to select files, load or download a web source.
		- `StringUtils`: do string formatting, HTML safety, and converting between different naming conventions.
		- `URLUtils`: parse or combine url query part.
		- `ValueListUtils`: works just like `ListUtils`, but handle numbers and strings.
	

## License

MIT