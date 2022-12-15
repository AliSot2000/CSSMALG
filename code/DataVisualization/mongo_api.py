import pymongo


class MongoAPI:
    client: pymongo.MongoClient
    db_name: str

    dummy_read: str
    dummy_write: str
    dummy_update: str

    def __init__(self, db_address: str, db_name: str, db_username: str, db_password: str, **kwargs):
        """
        :param db_address: Database Address like db.something.mongodb.net
        :param db_name: name of the database
        :param db_username: username
        :param db_password: password to username
        :param kwargs: Passed to the MongoClient.__init__ method. (i.e. tlsCAFile=certifi.where())
        """
        # initialising connection to Mongo
        self.client = pymongo.MongoClient(f"mongodb+srv://{db_username}:{db_password}@{db_address}/"
                                          f"{db_name}", **kwargs)

        self.db_name = db_name

    def collection(self, collection: str):
        return self.client[self.db_name][collection]

    def find_one(self, collection: str, filter_dict: dict = None, projection_dict: dict = None, sort: list = None):
        """
        Query the database.
        :param collection: Collection name string
        :param filter_dict: A dict specifying elements which must be present for a document to be included in the res
        :param projection_dict: A dict of field names that should be returned in the result
        :param sort: A list of (key, direction) pairs specifying the sort order for this query
        :return:
        """

        col = self.client[self.db_name][collection]

        return col.find_one(filter=filter_dict, projection=projection_dict, sort=sort)

    def find(self, collection: str, filter_dict: dict = None, projection_dict: dict = None, sort: list = None, skip:int = 0, limit: int = 0):
        """
        Query the database.
        :param collection: Collection name string
        :param filter_dict: A dict specifying elements which must be present for a document to be included in the result
        :param projection_dict: A dict of field names that should be returned in the result
        :param sort: A list of (key, direction) pairs specifying the sort order for this query
        :return:
        """

        col = self.client[self.db_name][collection]

        return list(col.find(filter=filter_dict, projection=projection_dict, sort=sort).skip(skip).limit(limit))

    def insert_one(self, collection: str, document_dict: dict = None):
        """
        Insert a single document.
        :param collection: Collection name string
        :param document_dict:  The document to insert
        :return: inserted id
        """
        if document_dict is None:
            document_dict = {}

        col = self.client[self.db_name][collection]

        result = col.insert_one(document=document_dict)

        return result.inserted_id

    def insert(self, collection: str, document_list: list = None):
        """
        Insert an iterable of documents.
        :param collection: Collection name string
        :param document_list:  The documents to insert into the db. Needs to be a list containing doction
        :return: inserted id
        """
        if document_list is None or len(document_list) < 1:
            return

        col = self.client[self.db_name][collection]

        result = col.insert_many(documents=document_list)

        return result.inserted_ids

    def update_one(self, collection: str, filter_dict: dict = None, update_dict: dict = None, upsert: bool = False):
        """
        Update a single document matching the filter.
        :param collection: Collection name string
        :param filter_dict: A dict specifying elements which must be present for a document to be included in the result
        :param update_dict: A dict with the modifications to apply
        :param upsert: If True, perform an insert if no documents match the filter
        :return: modified count
        """

        col = self.client[self.db_name][collection]

        result = col.update_one(filter=filter_dict, update=update_dict, upsert=upsert)

        return result.modified_count

    def update(self, collection: str, filter_dict: dict = None, update_dict: dict = None, upsert: bool = False):
        """
        Update one or more documents that match the filter.
        :param collection: Collection name string
        :param filter_dict: A dict specifying elements which must be present for a document to be included in the result
        :param update_dict: A dict with the modifications to apply
        :param upsert: If True, perform an insert if no documents match the filter
        :return: modified count
        """

        col = self.client[self.db_name][collection]

        result = col.update_many(filter=filter_dict, update=update_dict, upsert=upsert)

        return result.modified_count

    def delete_one(self, collection: str, filter_dict: dict = None):
        """
        Delete a single document matching the filter.
        :param collection: Collection name string
        :param filter_dict A dict specifying elements which must be present for a document to be included in the result
        :return: deleted count
        """

        col = self.client[self.db_name][collection]

        result = col.delete_one(filter=filter_dict)

        return result.deleted_count

    def delete(self, collection: str, filter_dict: dict = None):
        """
        Delete one or more documents matching the filter.
        :param collection: Collection name string
        :param filter_dict: A dict specifying elements which must be present for a document to be included in the result
        :return: deleted count
        """

        col = self.client[self.db_name][collection]

        result = col.delete_many(filter=filter_dict)

        return result.deleted_count

    def count(self, collection: str, filter_dict: dict = None):
        """
        Count the number of documents in this collection.
        :param collection: Collection name string
        :param filter_dict: A dict specifying elements which must be present for a document to be included in the result
        :return:
        """
        if filter_dict is None:
            filter_dict = {}

        col = self.client[self.db_name][collection]
        return col.count_documents(filter=filter_dict)