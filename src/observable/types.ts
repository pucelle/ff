interface WillUpdatable {

	/** Notify that some depedencies have changed, and current object should update soon. */
	willUpdate(): void
}

