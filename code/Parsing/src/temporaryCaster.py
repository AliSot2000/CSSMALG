import json

src_file = "/home/alisot2000/Documents/01_ReposNCode/CSSMALG/code/Parsing/data/mapExport.tsim"
dest_file = "/home/alisot2000/Documents/01_ReposNCode/CSSMALG/code/Parsing/data/mapExport4.tsim"


def list_processor(target: list):
    """
    Walks over a list, if an entry is a dict, it calls the dict_walker on the object

    :param target: list to walk along
    """
    for elm in target:
        if type(elm) is dict:
            dict_walker_id_caster(elm)


def dict_walker_id_caster(target: dict):
    """
    Performs a walk. for every key in the dictionary, it casts to string if the name is id.
    If the value is a dict, it continues walking down it.

    :param target: dictionary to walk along
    :return:
    """
    for key, value in target.items():
        if type(value) is list:
            list_processor(value)
            
        elif type(value) is dict:
            dict_walker_id_caster(value)
            
        elif key == "id":
            target[key] = str(target[key])

        elif key == "speed_limit":
            target[key] = int(target[key])

        elif key == "start":
            target[key] = {"id": str(target[key])}

        elif key == "end":
            target[key] = {"id": str(target[key])}

        elif key == "oppositeStreetId":
            target[key] = str(target[key])

        # elif key == "distance":
        #     target[key] = float(target[key])


if __name__ == "__main__":
    with open(src_file, "r") as f:
        data = json.load(f)
        
    if type(data) is dict:
        dict_walker_id_caster(data)
        
    with open(dest_file, "w") as f :
        json.dump(data, f, indent="    ")
    
